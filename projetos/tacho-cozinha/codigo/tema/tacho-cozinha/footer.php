</main>
<footer class="site-footer">
	<div class="wrap footer-grid">
		<div>
			<p class="footer-brand">Tacho<small>cozinha mineira</small></p>
			<p class="muted"><?php echo esc_html( tacho_opt( 'address' ) ); ?></p>
		</div>
		<nav aria-label="Rodapé">
			<?php wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'fallback_cb' => 'tacho_fallback_menu', 'depth' => 1 ) ); ?>
		</nav>
		<div>
			<?php if ( is_active_sidebar( 'footer-notice' ) ) : dynamic_sidebar( 'footer-notice' ); else : ?>
				<p class="muted">Funcionamento: <?php echo esc_html( tacho_opt( 'hours' ) ); ?></p>
			<?php endif; ?>
		</div>
	</div>
	<div class="wrap legal">
		<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Tacho Cozinha Mineira</span>
		<span>Negócio fictício · projeto de portfólio, tema WordPress próprio</span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
