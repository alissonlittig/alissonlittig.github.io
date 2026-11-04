<section class="hero">
	<div class="wrap hero-grid">
		<div class="hero-copy">
			<p class="eyebrow">Curitiba · atendimento com hora marcada</p>
			<h1>Cuidado de verdade, <em>sem pressa</em> e sem susto.</h1>
			<p class="lead">Consultas calmas, exames no mesmo dia e uma equipe que explica cada passo. A Mansa trata o seu bichinho do jeito que a gente trataria o nosso.</p>
			<div class="hero-actions">
				<a class="btn" href="#contato">Agendar consulta</a>
				<a class="btn btn-ghost" href="<?php echo esc_url( get_post_type_archive_link( 'servico' ) ?: '#servicos' ); ?>">Ver serviços</a>
			</div>
			<p class="hero-note"><span class="dot"></span> Urgências 24h · <?php echo esc_html( mansa_opt( 'phone' ) ); ?></p>
		</div>
		<div class="hero-art" aria-hidden="true">
			<?php get_template_part( 'template-parts/art' ); ?>
		</div>
	</div>
</section>
