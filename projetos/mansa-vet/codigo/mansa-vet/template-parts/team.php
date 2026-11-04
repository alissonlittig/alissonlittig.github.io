<?php
$q = new WP_Query( array( 'post_type' => 'profissional', 'posts_per_page' => 4, 'orderby' => 'menu_order', 'order' => 'ASC' ) );
$tones = array( '#A9BFA8', '#F3C9A8', '#D9A07F', '#7E9C93' );
?>
<section class="section section-sand" id="equipe">
	<div class="wrap">
		<header class="section-head">
			<p class="eyebrow">Equipe</p>
			<h2>Quem vai cuidar do seu bicho.</h2>
		</header>
		<div class="team-grid">
			<?php
			$i = 0;
			while ( $q->have_posts() ) :
				$q->the_post();
				$initials = '';
				foreach ( array_slice( preg_split( '/\s+/', preg_replace( '/^(Dra?\.)\s+/', '', get_the_title() ) ), 0, 2 ) as $w ) {
					$initials .= mb_substr( $w, 0, 1 );
				}
				?>
				<article class="member">
					<div class="avatar" style="background:<?php echo esc_attr( $tones[ $i % 4 ] ); ?>"><?php echo esc_html( $initials ); ?></div>
					<h3><?php the_title(); ?></h3>
					<p class="role"><?php echo esc_html( get_post_meta( get_the_ID(), 'mansa_role', true ) ); ?></p>
					<p><?php echo esc_html( wp_strip_all_tags( get_the_content() ) ); ?></p>
				</article>
				<?php
				$i++;
			endwhile;
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
